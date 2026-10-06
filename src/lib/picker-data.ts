import type { DeviceWithSource } from './devices';
import type { ExerciseWithSource } from './exercises';
import type { EditorDevice, PickerExercise } from './template-edit';

/** Shared projection for the actual program editor, including its isolated demo. */
export function pickerExercises(list: readonly ExerciseWithSource[]): PickerExercise[] {
  return list.map((exercise) => ({
    id: exercise.id,
    title: exercise.title,
    category: exercise.category,
    trackingType: exercise.trackingType,
    equipment: exercise.equipment,
    ...(exercise.deviceId ? { deviceId: exercise.deviceId } : {}),
    ...(exercise.pattern ? { pattern: exercise.pattern } : {}),
    ...(exercise.grip ? { grip: exercise.grip } : {}),
    ...(exercise.alternatives?.length ? { alternatives: exercise.alternatives } : {}),
    ...(exercise.progression ? { progression: exercise.progression } : {}),
    loadStepKg: exercise.loadStepKg,
    minLoadKg: exercise.minLoadKg,
    primaryMuscles: exercise.primaryMuscles,
    secondaryMuscles: exercise.secondaryMuscles,
    stabilizerMuscles: exercise.stabilizerMuscles,
    source: exercise.source,
  }));
}

export function pickerDevices(list: readonly DeviceWithSource[]): EditorDevice[] {
  return list.map((device) => ({
    id: device.id,
    name: device.name,
    kind: device.kind,
    ...(device.baseKg !== undefined ? { baseKg: device.baseKg } : {}),
    ...(device.stepKg !== undefined ? { stepKg: device.stepKg } : {}),
    ...(device.maxKg !== undefined ? { maxKg: device.maxKg } : {}),
    ...(device.addOnsKg?.length ? { addOnsKg: device.addOnsKg } : {}),
    ...(device.pulleyRatio !== undefined ? { pulleyRatio: device.pulleyRatio } : {}),
    ...(device.weightsKg?.length ? { weightsKg: device.weightsKg } : {}),
  }));
}
