import React, { useEffect } from "react"
import { ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex"
import styled from "styled-components"
import "../reset.css" // Undo default stylings
import 'react-reflex/styles.css';
import { EditorGame } from "./editor"
import { Events } from "src/events/events";

const FullPageDiv = styled.div`
  display: flex;
  position: relative;
  width: 100vw;
  height: 100vh;
`

export const EditorPage = () => {

  useEffect(() => {

  }, [])

  return (
    <FullPageDiv>
      <ReflexContainer orientation="vertical" style={{height: "100%"}}>
        <ReflexElement flex={4} propagateDimensions={true} className="noscroll">
          <EditorGame/>
        </ReflexElement>
        <ReflexSplitter propagate={false} />
        <ReflexElement flex={1} propagateDimensions={true} className="noscroll">
          <button onClick={() => {
            Events.emit('boot', undefined);
          }}>Boot</button>
          <button onClick={() => {
            Events.emit('pause', undefined);
          }}>Pause</button>
           <button onClick={() => {
            Events.emit('unpause', undefined);
          }}>UnPause</button>
        </ReflexElement>
      </ReflexContainer>
    </FullPageDiv>
  )
}