import { Scene } from "common/src/routes/scene/scene"
import React from "react";
import { TsProxy } from "src/api/tsProxy";
import { useRest } from "src/api/useRest";

const useScenes = () => {
    const results = useRest(TsProxy.scene.get)
    return results.data || []
}

type SceneComponentProps = {
    scene: Scene
}
const SceneComponent = ({scene}: SceneComponentProps) => {
    return <div>
        <a href={scene.code}>{scene.name}</a>
    </div>
}

export const SceneEditor = () => {

    const scenes = useScenes();

    return (
        <>
        {
            scenes.map(scene => <SceneComponent scene={scene} key={scene.name}/>)
        }</>
    )
}