import { OrchestratableScene } from './orchestratableScene'

export type DependentScene<T extends OrchestratableScene> = Phaser.Scene & {
  init: (parentScene: T) => void
  create: (parentScene: T) => void
}
