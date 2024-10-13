import _ from 'lodash'
import { Events } from 'src/events/events'

export const mapUISceneName = 'MapUIScene'

const TIME_SAMPLES = 30

export class MapUIScene extends Phaser.Scene {
  constructor() {
    super({
      key: mapUISceneName,
      // active: true,
      // visible: true,
    })
  }

  private stepTimeText?: Phaser.GameObjects.Text
  private readyToUpdate = false

  private times = new Array(TIME_SAMPLES).fill(0)
  private timesIndex = 0

  create() {
    this.stepTimeText = this.add.text(30, 30, 'Testing')
    Events.on('updateStepTime', (stepTimeMs) => {
      if (!this.readyToUpdate) {
        return
      }
      this.addTimeSample(stepTimeMs)
    })
  }

  update(): void {
    this.readyToUpdate = true
  }

  private addTimeSample(time: number) {
    this.times[this.timesIndex] = time
    this.timesIndex++
    if (this.timesIndex >= TIME_SAMPLES) {
      // reset and update display
      this.timesIndex = 0
      const avg = _.mean(this.times)
      this.stepTimeText?.setText(`step time: ${_.round(avg, 2)}ms`)
    }
  }
}
