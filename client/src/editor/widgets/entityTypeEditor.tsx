
import React from "react"
import { ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex"
import { Events } from "src/events/events"
import styled from "styled-components"
import { EntityTypeList } from "./entityTypeList"

const Container = styled.div`
  display: flex;
  position: relative;
  height: 100%;
  flex-direction: column;
`

export const EntityTypeEditor = () => {

  return (
    <Container>
      <ReflexContainer orientation="horizontal" style={{height: "100%"}}>
        <ReflexElement flex={1}  className="noscroll">
          <EntityTypeList/>
        </ReflexElement>
        <ReflexSplitter />
        <ReflexElement flex={1} className="noscroll">
          <button onClick={() => {
            Events.emit('boot');
          }}>Boot</button>
          <button onClick={() => {
            Events.emit('pause');
          }}>Pause</button>
          <button onClick={() => {
            Events.emit('unpause');
          }}>UnPause</button>
        </ReflexElement>
      </ReflexContainer>
    </Container>
  )
}