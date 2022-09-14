import React from "react"
import styled from "styled-components"
import "../reset.css" // Undo default stylings
import { MainGame } from "./mainGame"

const FullPageDiv = styled.div`
  display: flex;
  position: relative;
  width: 100vw;
  height: 100vh;
`

export const MainGamePage = () => {
  return (
    <FullPageDiv>
      <MainGame/>
    </FullPageDiv>
  )
}