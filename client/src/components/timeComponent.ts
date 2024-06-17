import { Types, defineComponent } from "bitecs";

export const TimeComponent = defineComponent({
    time: Types.i32,
    delta: Types.i32,
})