import React from "react"
import styled from "styled-components"
import "../reset.css" // Undo default stylings
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
      <EditorGame/>
    </FullPageDiv>
  )
}