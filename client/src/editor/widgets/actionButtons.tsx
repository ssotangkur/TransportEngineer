import React from 'react'
import { Events } from 'src/events/events'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  flex-grow: 0;
`

export const ActionButtons = () => {
  return (
    <Container>
      <button
        onClick={() => {
          Events.emit('boot')
        }}
      >
        Boot
      </button>
      <button
        onClick={() => {
          Events.emit('pause')
        }}
      >
        Pause
      </button>
      <button
        onClick={() => {
          Events.emit('unpause')
        }}
      >
        UnPause
      </button>
      <button
        onClick={() => {
          Events.emit('regenerateMap')
        }}
      >
        Regenerate Map
      </button>
    </Container>
  )
}
