import { Types, defineComponent } from "bitecs";

export const MousePositionComponent = defineComponent({
    x: Types.i16,
    y: Types.i16,
})

export const MouseDoubleClickComponent = defineComponent({
    _leftButtonReleaseTime: Types.i32,
    _wasLeftButtonDownLastTick: Types.i8,
    isDoubleClick: Types.i8,
    
})