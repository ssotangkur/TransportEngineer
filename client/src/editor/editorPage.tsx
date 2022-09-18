import React from "react"
import { ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex"
import styled from "styled-components"
import "../reset.css" // Undo default stylings
import 'react-reflex/styles.css';
import { EditorGame } from "./editor"
import "phaser";
import { Tab, Tabs } from "./widgets/tabs";
import { EntityTypeEditor } from "./widgets/entityTypeEditor";

const FullPageDiv = styled.div`
  display: flex;
  position: relative;
  width: 100vw;
  height: 100vh;
`

export const EditorPage = () => {

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
             <EntityTypeEditor/>
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