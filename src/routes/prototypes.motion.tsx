import { createFileRoute } from '@tanstack/react-router'

import { MotionCalibration } from '#/prototypes/motion-calibration'

export const Route = createFileRoute('/prototypes/motion')({ component: MotionCalibration })
