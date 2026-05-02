import { Event } from "./typings";
import { error } from "./logging";

export const events: { [key: string]: Array<Event> } = {
  inputSubmit: [], // A button is pressed
  cellDone: [], // Cell is "done" (either all actions are fired, or it's a "forced" done like an input button press)
  projectEnded: [], // No more nodes to traverse
};

export function onEvent(
  eventType: string,
  fn: Function,
  props: { once: boolean; name: string }
) {
  const eventObj = events[eventType];
  if (!eventObj) {
    // Compile list of valid events
    let eventNamesStr = "";
    const eventNames = Object.keys(events);
    for (var i = 0; i < eventNames.length; i++) {
      let eventNameStr = eventNames[i];
      if (i !== eventNames.length - 1) {
        eventNameStr += ", ";
      }
      eventNamesStr += eventNameStr;
    }
    // Throw error
    error(
      `The "${eventType}" event type is not valid. Choose from one of the following: ${eventNamesStr}`
    );
    return;
  } else {
    // If valid, add to the event object
    eventObj.push({
      fn: fn,
      name: props.name,
      once: props.once,
    });
  }
}

export function removeEvent(eventType: string, eventName: string) {
  const eventObj = events[eventType];
  if (!eventObj) {
    error(`The event type "${eventName}" doesn't exist.`);
    return;
  }
  let event;
  // Check if the event
  for (var i = 0; i < eventObj.length; i++) {
    const thisEvent = eventObj[i];
    if (thisEvent.name === eventName) {
      event = thisEvent;
    }
  }
  if (!event) {
    error(
      `The "${eventName}" event doesn't exist under the "${eventType}" event type, so nothing was removed.`
    );
    return;
  }
  const newEvents: Array<Event> = [];
  eventObj.forEach((event) => {
    if (event.name !== eventName) {
      newEvents.push(event);
    }
  });
  events[eventType] = newEvents;
}

export function runEvents(eventType: string) {
  const eventObj = events[eventType];
  if (!eventObj) {
    error(`The event type "${eventType}" doesn't exist.`);
    return;
  }
  eventObj.forEach((event) => {
    event.fn();
    if (event.once === true) {
      removeEvent(eventType, event.name);
    }
  });
}
