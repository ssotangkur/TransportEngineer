import { Scene } from "common/src/routes/scene/scene";
import { OrchestratableScene } from "./orchestratableScene";
import { System } from "common/src/routes/system/system";


export class DataDrivenSystem {
    constructor (system: System) {
        
    }


}

export class ECSScene extends OrchestratableScene {

    // private systems: DataDrivenSystem[]

    constructor (scene: Scene) {
        super(scene.name);

       

        // @TODO add systems from scene config
        // this.systems = scene.systems.map((sysConfig) => {
            
        // })
    }
}