import React from "react"
import { ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex"
import styled from "styled-components"
import "../reset.css" // Undo default stylings
import 'react-reflex/styles.css';
import { EditorGame } from "./editor"

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
        <ReflexElement flex={4} propagateDimensions={true} className="noscroll">
          <EditorGame/>
        </ReflexElement>
        <ReflexSplitter propagate={false} />
        <ReflexElement flex={1} propagateDimensions={true} className="noscroll">
          <button>Test</button>
        </ReflexElement>
      </ReflexContainer>
    </FullPageDiv>
  )
}