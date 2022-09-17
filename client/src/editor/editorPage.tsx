import React, { useEffect } from "react"
import { ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex"
import styled from "styled-components"
import "../reset.css" // Undo default stylings
import 'react-reflex/styles.css';
import { EditorGame } from "./editor"
import "phaser";
import { Events } from "src/events/events";
import { EntityTypeList } from "./widgets/entityTypeList";
import { catalog } from "src/entities/catalog";
import { Tab, Tabs } from "./widgets/tabs";

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
        <ReflexElement flex={4}  className="noscroll">
          <EditorGame/>
        </ReflexElement>
        <ReflexSplitter />
        <ReflexElement flex={1} className="noscroll">
          <Tabs>
          <Tab label="Tab1">
            <ReflexContainer orientation="horizontal" style={{height: "100%"}}>
              <ReflexElement flex={1} className="noscroll">
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
              <ReflexSplitter />
              <ReflexElement flex={1}  className="noscroll">
              <EntityTypeList entityTypes={catalog}/>
              </ReflexElement>
            </ReflexContainer>
            </Tab>
            <Tab label="Tab2">
              Content2
            </Tab>
          </Tabs>
        </ReflexElement>
      </ReflexContainer>
    </FullPageDiv>
  )
}