// uses protobuf-ts's reflection metadata to convert Discord's
// protobufs to .proto message declarations
//
// example usage:
// ```ts
// const protoToString = p => {
//   const _toStrings = (p, into) => {
//     for (const key in p) {
//       if (p[key] instanceof ProtoType) {
//         into.push(p[key].toString());
//       } else {
//         _toStrings(p[key], into);
//       }
//     }
//
//     return into;
//   };
//
//   return _toStrings(p, []).join('\n');
// };
//
// const UserSettingsProtoStore = webpackChunkdiscord_app
//   .push([[Date.now()], {}, e => Object.values(e.c)])
//   .find(m => m?.exports?.Z?.frecencyWithoutFetchingLatest).exports.Z;
//
// const protoReflectionSymbol = Object.getOwnPropertySymbols(
//   UserSettingsProtoStore.settings
// )[0];
//
// const settingsReflectionMetadata =
//   UserSettingsProtoStore.settings[protoReflectionSymbol];
// const frecencyReflectionMetadata =
//   UserSettingsProtoStore.frecencyWithoutFetchingLatest[protoReflectionSymbol];
//
// const settingsProto = new ProtoMessage(settingsReflectionMetadata).flatten();
// const frecencyProto = new ProtoMessage(frecencyReflectionMetadata).flatten();
//
// protoToString(settingsProto);
// protoToString(frecencyProto);
// ```

import {
  ScalarType,
  RepeatType,
  EnumInfo,
  MessageInfo,
  FieldInfo,
} from '@protobuf-ts/runtime';

const scalarTypeToName = (s: ScalarType): string => {
  return ScalarType[s].toLowerCase();
};

abstract class ProtoType {
  abstract name: string;
  abstract package: string;
  abstract toString(): string;

  flatten(state: FlatProto = {}): FlatProto {
    const pkg = this.package.split('.');

    const last: FlatProto = pkg.reduce((a, c) => {
      if (!(c in a)) {
        a[c] = {} as FlatProto;
      }
      return a[c] as FlatProto;
    }, state);

    last[this.name] = this;

    return state;
  }
}

type FlatProto = {[key: string]: FlatProto | ProtoType};

class ProtoMessage extends ProtoType {
  fields: ProtoField[];

  name: string;
  package: string;

  constructor(m: MessageInfo) {
    super();

    const pkg = m.typeName.split('.');

    this.fields = m.fields.map(f => new ProtoField(f));
    this.name = pkg.pop()!;
    this.package = pkg.join('.');

    this.fields.sort((a, b) => a.position - b.position);
  }

  toString(): string {
    const fields = this.fields.map(f => f.toString());
    return `message ${this.name} {${fields.join('')}}`;
  }

  flatten(state: FlatProto = {}): FlatProto {
    for (const field of this.fields) {
      field.flatten(state);
    }

    return super.flatten(state);
  }
}

class ProtoEnum extends ProtoType {
  name: string;
  package: string;
  variants: Record<string, number> = {};

  constructor(e: EnumInfo) {
    super();

    const pkg = e[0].split('.');
    this.name = pkg.pop()!;
    this.package = pkg.join('.');

    Object.entries(e[1]).reduce((a, [k, v]) => {
      if (!isNaN(Number(k))) {
        return a;
      }

      const prefix = e[2] || '';
      a[prefix + k] = v as number;

      return a;
    }, this.variants);
  }

  toString(): string {
    const variants = Object.entries(this.variants);
    variants.sort((a, b) => a[1] - b[1]);

    const variantsFormatted = variants.map(([k, v]) => `${k} = ${v};`);

    return `enum ${this.name} {${variantsFormatted.join('')}}`;
  }
}

class ProtoField {
  name: string;
  type: string;
  kind: FieldInfo['kind'];

  optional: boolean;
  repeat: RepeatType;
  position: number;

  requires: ProtoType[] = [];

  constructor(f: FieldInfo) {
    this.name = f.name;
    this.kind = f.kind;
    this.repeat = f.repeat;
    this.optional = f.opt;
    this.position = f.no;

    switch (f.kind) {
      case 'message': {
        const msg = new ProtoMessage(f.T());

        this.requires.push(msg);
        this.type = msg.name;

        break;
      }

      case 'enum': {
        const enm = new ProtoEnum(f.T());

        this.requires.push(enm);
        this.type = enm.name;

        break;
      }

      case 'map': {
        const keyType = scalarTypeToName(f.K);
        let valType: string;

        switch (f.V.kind) {
          case 'message': {
            const msg = new ProtoMessage(f.V.T());

            this.requires.push(msg);
            valType = msg.name;

            break;
          }

          case 'enum': {
            const enm = new ProtoEnum(f.V.T());

            this.requires.push(enm);
            valType = enm.name;

            break;
          }

          case 'scalar': {
            valType = scalarTypeToName(f.V.T);
            break;
          }
        }

        this.type = `map<${keyType}, ${valType}>`;

        break;
      }

      case 'scalar': {
        this.type = scalarTypeToName(f.T);
        break;
      }
    }
  }

  toString(): string {
    const parts: string[] = [];

    if (this.optional) {
      parts.push('optional');
    }

    if (this.repeat) {
      parts.push('repeated');
    }

    parts.push(this.type, this.name, '=', this.position.toString());

    // TODO: figure out how to make this work
    // if (this.repeat) {
    //   parts.push(`[packed = ${this.repeat === RepeatType.PACKED}]`);
    // }

    return parts.join(' ') + ';';
  }

  flatten(state: FlatProto = {}) {
    for (const req of this.requires) {
      req.flatten(state);
    }
  }
}
