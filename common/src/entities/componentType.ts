export enum DataType {
  "string",
  "number",
  "boolean",
  "vec2",
}

type PropMeta<TypeString extends string, InitialType> = {
  name: string;
  type: TypeString;
  initial?: InitialType;
};

export type PropertyMeta =
  | PropMeta<"string", string>
  | PropMeta<"number", number>
  | PropMeta<"boolean", boolean>
  | PropMeta<"vec2", Phaser.Types.Math.Vector2Like>;

export interface ComponentType {
  name: string;
  props: PropertyMeta[];
}

export const allComponentTypes: ComponentType[] = [
  {
    name: "position",
    props: [
      {
        name: "position",
        type: "vec2",
        initial: new Phaser.Math.Vector2(0, 0),
      },
    ],
  },
  {
    name: "size",
    props: [
      { name: "width", type: "number", initial: 0 },
      { name: "height", type: "number", initial: 0 },
    ],
  },
];
