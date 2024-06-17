import { IWorld, addEntity } from "bitecs";
import { BaseSystem } from "./baseSystem";

export type SingletonWorld = {
    singleton: {
        eid: number
    }
}

// This should be the first
// It just creates the singleton entity eid and stores it in the world
export class SingletonSystem<WorldIn extends IWorld> extends BaseSystem<IWorld, WorldIn, SingletonWorld> {
    createWorld(_worldIn: IWorld) {
        return {
            ..._worldIn,
            singleton: {
                eid: addEntity(_worldIn)
            }
        };
    }
}