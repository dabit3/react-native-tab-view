/* @flow */

import { Animated, Platform } from 'react-native';
import type { GestureEvent, GestureState } from './PanResponderTypes';
import type { Route, SceneRendererProps } from './TabViewTypeDefinitions';

type Props = SceneRendererProps & {
  route: Route
}

const POSITION_THRESHOLD = 120;
const VELOCITY_THRESHOLD = Platform.OS === 'android' ? 0.0000005 : 0.5; // on Android, velocity is way lower, perhaps due to timestamp being in nanosecond

function forHorizontal(props: Props) {
  let lastValue = null;
  let isMoving = null;

  function isIndexInRange(index: number) {
    const { routes } = props.navigationState;
    return (index >= 0 && index <= routes.length - 1);
  }

  function isMovingHorzontally(evt: GestureEvent, gestureState: GestureState) {
    return (
      (Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 3)) &&
      (Math.abs(gestureState.vx) > Math.abs(gestureState.vy * 3))
    );
  }

  function getNextIndex(evt: GestureEvent, gestureState: GestureState) {
    const { index } = props.navigationState;
    if (Math.abs(gestureState.dx) > POSITION_THRESHOLD || Math.abs(gestureState.vx) > VELOCITY_THRESHOLD) {
      const nextIndex = index - (gestureState.dx / Math.abs(gestureState.dx));
      if (isIndexInRange(nextIndex)) {
        return nextIndex;
      }
    }
    return index;
  }

  function canMoveScreen(evt: GestureEvent, gestureState: GestureState) {
    const { routes, index } = props.navigationState;
    return (
      isMovingHorzontally(evt, gestureState) && (
        (gestureState.dx >= 0 && index >= 0) ||
        (gestureState.dx <= 0 && index <= routes.length - 1)
    ));
  }

  function startGesture() {
    lastValue = props.getLastPosition();
  }

  function respondToGesture(evt: GestureEvent, gestureState: GestureState) {
    const { layout: { width } } = props;
    const currentPosition = typeof lastValue === 'number' ? lastValue : props.navigationState.index;
    const nextPosition = currentPosition - (gestureState.dx / width);
    if (isMoving === null) {
      isMoving = isMovingHorzontally(evt, gestureState);
    }
    if (isMoving && isIndexInRange(nextPosition)) {
      props.position.setValue(nextPosition);
    }
  }

  function finishGesture(evt: GestureEvent, gestureState: GestureState) {
    const currentIndex = props.navigationState.index;
    const currentValue = props.getLastPosition();
    if (currentValue !== currentIndex) {
      if (isMoving) {
        const nextIndex = getNextIndex(evt, gestureState);
        props.jumpToIndex(nextIndex);
      } else {
        props.jumpToIndex(currentIndex);
      }
    }
    lastValue = null;
    isMoving = null;
  }

  return {
    onStartShouldSetPanResponder: (evt: GestureEvent, gestureState: GestureState) => {
      return canMoveScreen(evt, gestureState);
    },
    onStartShouldSetPanResponderCapture: (evt: GestureEvent, gestureState: GestureState) => {
      return canMoveScreen(evt, gestureState);
    },
    onMoveShouldSetPanResponder: (evt: GestureEvent, gestureState: GestureState) => {
      return canMoveScreen(evt, gestureState);
    },
    onMoveShouldSetPanResponderCapture: (evt: GestureEvent, gestureState: GestureState) => {
      return canMoveScreen(evt, gestureState);
    },
    onPanResponderGrant: (evt: GestureEvent, gestureState: GestureState) => {
      startGesture(evt, gestureState);
    },
    onPanResponderMove: (evt: GestureEvent, gestureState: GestureState) => {
      respondToGesture(evt, gestureState);
    },
    onPanResponderTerminationRequest: () => true,
    onPanResponderRelease: (evt: GestureEvent, gestureState: GestureState) => {
      finishGesture(evt, gestureState);
    },
    onPanResponderTerminate: (evt: GestureEvent, gestureState: GestureState) => {
      finishGesture(evt, gestureState);
    },
    onShouldBlockNativeResponder: () => false,
  };
}

export default {
  forHorizontal,
};
