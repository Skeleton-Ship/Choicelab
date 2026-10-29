import { ActionDefProp, ActionDefs } from "../../../typings";
import {
  FCText,
  FCButton,
  // FCImage,
  FCAudio,
  FCVideo,
  // FCSilence,
  FCBackgroundAudio,
  FCBackgroundVideo,
  FCEndBackground,
} from "./internalActionFlowchartEls";

const positionProp: ActionDefProp = {
  name: "position",
  label: "Position",
  className: "",
  control: "__CUSTOM__Position",
  default: { kind: "absolute", x: 50, y: 50 },
};
const maxWidthProp: ActionDefProp = {
  name: "maxWidth",
  label: "Max Width",
  labelSuffix: "%",
  control: "number",
  className: "col-2",
  default: 45,
};
const fitProp: ActionDefProp = {
  name: "fit",
  label: "Fit",
  className: "col-2",
  control: "dropdown",
  default: "cover",
  options: [
    { value: "cover", label: "Cover" },
    { value: "contain", label: "Contain" },
  ],
};

const internalActionDefs: ActionDefs = {
  name: "__CHOICELAB__STANDARD__",
  label: "Choicelab Standard",
  actions: [
    {
      name: "text",
      label: "Show Text",
      description:
        "A block of text that can appear instantly or be associated with a timeline action.",
      timedElement: true,
      category: "event",
      editor: {
        iconName: "text-left",
        iconColor: "#2f2f52",
        iconBackgroundColor: "#FFC300",
      },
      flowchart: FCText,
      props: [
        {
          name: "contents",
          label: "Contents",
          control: "textarea",
          className: "large hide-label",
          default: "",
          required: true,
        },
        {
          name: "role",
          label: "Role",
          control: "dropdown",
          className: "col-2",
          default: "body",
          options: [
            { value: "body", label: "Body Text" },
            { value: "heading", label: "Heading" },
            { value: "subheading", label: "Subheading" },
          ],
        },
        positionProp,
        maxWidthProp,
      ],
    },
    {
      name: "audio",
      label: "Play Audio",
      description: "Play an audio file.",
      mediaElement: true,
      category: "timeline",
      flowchart: FCAudio,
      editor: {
        iconName: "volume-up-fill",
        iconColor: "white",
        iconBackgroundColor: "#FE334F",
      },
      props: [
        {
          name: "source",
          label: "Audio File",
          control: "audio",
          className: "hide-label",
          required: true,
        },
        {
          name: "captions",
          label: "Caption File",
          control: "captions",
        },
        {
          name: "endCell",
          label: "Advance to next node when done, regardless of other actions",
          control: "boolean",
          default: false,
        },
      ],
    },
    {
      name: "video",
      label: "Play Video",
      description: "Play a video file.",
      mediaElement: true,
      category: "timeline",
      flowchart: FCVideo,
      editor: {
        iconName: "film",
        iconColor: "white",
        iconBackgroundColor: "#27CD8B",
      },
      props: [
        {
          name: "source",
          label: "Video File",
          control: "video",
          className: "hide-label",
          required: true,
        },
        {
          name: "captions",
          label: "Caption File",
          control: "captions",
        },
        {
          name: "endCell",
          label: "Advance to next node when done, regardless of other actions",
          control: "boolean",
          default: false,
        },
        {
          name: "muted",
          label: "Muted",
          control: "boolean",
          default: false,
        },
        {
          name: "buildIn",
          label: "Build In",
          control: "dropdown",
          default: "fade",
          options: [
            { value: "fade", label: "Fade" },
            { value: "none", label: "None" },
          ],
        },
        {
          name: "buildOut",
          label: "Build Out",
          control: "dropdown",
          default: "fade",
          options: [
            { value: "fade", label: "Fade" },
            { value: "none", label: "None" },
          ],
        },
        fitProp,
      ],
    },
    /*
    {
      name: "image",
      label: "Show Image",
      description:
        "An image file that can appear instantly or be associated with a media action.",
      mediaElement: false,
      timedElement: true,
      flowchart: FCImage,
      editor: {
        iconName: "image",
        iconColor: "white",
        iconBackgroundColor: "#AF53DE",
      },
      props: [
        {
          name: "source",
          label: "Image File",
          control: "image",
          className: "hide-label",
          default: "",
          required: true,
        },
        {
          name: "alt",
          label: "Alt Text",
          control: "textarea",
          default: "",
        },
      ],
    },
	*/
    {
      name: "button",
      label: "Show Button",
      description: "A button that, when pressed, advances to the next node.",
      timedElement: true,
      mediaElement: false,
      inputElement: true,
      category: "interact",
      flowchart: FCButton,
      editor: {
        iconName: "three-dots",
        iconColor: "white",
        iconBackgroundColor: "#FF9502",
      },
      props: [
        {
          name: "label",
          label: "Label",
          control: "text",
          required: true,
          default: "Continue",
        },
        {
          name: "varToSet",
          label: "Variable to Set",
          control: "variable",
          className: "col-2",
          required: true,
        },
        {
          name: "value",
          label: "Value to Set",
          control: "variableValue",
          className: "col-2",
          required: true,
        },
        // {
        //   name: "saveInputs",
        //   label: "Save Input Fields When Clicked",
        //   control: "boolean",
        //   default: true,
        // },
        positionProp,
        maxWidthProp,
      ],
    },
    /*
    {
      name: "inputField",
      label: "Show Input Field",
      description: "A fill-in-the-blank field for entering information.",
      timedElement: true,
      mediaElement: false,
      inputElement: true,
      flowchart: FCInputField,
      editor: {
        iconName: "input-cursor-text",
        iconColor: "#027AFF",
        iconBackgroundColor: "#E9F2FF",
      },
      props: [
        {
          name: "label",
          label: "Label",
          control: "text",
          required: true,
          default: "",
        },
        {
          name: "type",
          label: "Field",
          control: "dropdown",
          default: "text",
          className: "col-2",
          options: [
            {
              value: "text",
              label: "Text",
            },
            {
              value: "textarea",
              label: "Text Area",
            },
            {
              value: "number",
              label: "Number",
            },
          ],
        },
        {
          name: "varToSet",
          label: "Variable to Set",
          control: "variable",
          className: "col-2",
          required: true,
        },
        positionProp,
        maxWidthProp,
      ],
    },
	*/
    {
      name: "backgroundAudio",
      label: "Play Background Audio",
      description:
        "Play an audio file in the background without blocking cell progression.",
      mediaElement: false,
      category: "event",
      flowchart: FCBackgroundAudio,
      editor: {
        iconName: "volume-up-fill",
        iconColor: "white",
        iconBackgroundColor: "#0097A7",
      },
      props: [
        {
          name: "source",
          label: "Audio File",
          control: "audio",
          className: "hide-label",
          required: true,
        },
        {
          name: "loop",
          label: "Loop",
          control: "boolean",
          default: false,
        },
        {
          name: "persist",
          label: "Persist across cells",
          control: "boolean",
          default: false,
        },
        {
          name: "name",
          label: "Name",
          control: "text",
          default: "",
        },
      ],
    },
    {
      name: "backgroundVideo",
      label: "Play Background Video",
      description:
        "Play a video file in the background without blocking cell progression.",
      mediaElement: false,
      category: "event",
      flowchart: FCBackgroundVideo,
      editor: {
        iconName: "film",
        iconColor: "white",
        iconBackgroundColor: "#1B7F5A",
      },
      props: [
        {
          name: "source",
          label: "Video File",
          control: "video",
          className: "hide-label",
          required: true,
        },
        {
          name: "loop",
          label: "Loop",
          control: "boolean",
          default: false,
        },
        {
          name: "muted",
          label: "Muted",
          control: "boolean",
          default: false,
        },
        {
          name: "persist",
          label: "Persist across cells",
          control: "boolean",
          default: false,
        },
        {
          name: "name",
          label: "Name",
          control: "text",
          default: "",
        },
        {
          name: "buildIn",
          label: "Build In",
          control: "dropdown",
          default: "fade",
          options: [
            { value: "fade", label: "Fade" },
            { value: "none", label: "None" },
          ],
        },
        {
          name: "buildOut",
          label: "Build Out",
          control: "dropdown",
          default: "fade",
          options: [
            { value: "fade", label: "Fade" },
            { value: "none", label: "None" },
          ],
        },
        fitProp,
      ],
    },
    {
      name: "endBackgroundAudio",
      label: "End Background Audio",
      description: "Stop background audio that persists across cells.",
      mediaElement: false,
      category: "event",
      flowchart: FCEndBackground,
      editor: {
        iconName: "stop-fill",
        iconColor: "white",
        iconBackgroundColor: "#0097A7",
      },
      props: [
        {
          name: "name",
          label: "Name",
          control: "text",
          required: true,
          default: "",
        },
      ],
    },
    {
      name: "endBackgroundVideo",
      label: "End Background Video",
      description: "Stop background video that persists across cells.",
      mediaElement: false,
      category: "event",
      flowchart: FCEndBackground,
      editor: {
        iconName: "stop-fill",
        iconColor: "white",
        iconBackgroundColor: "#1B7F5A",
      },
      props: [
        {
          name: "name",
          label: "Name",
          control: "text",
          required: true,
          default: "",
        },
      ],
    },
    /*
    {
      name: "silence",
      label: "Play Silence",
      description:
        "A block of silence, useful for timing visual elements without audio or video accompaniment.",
      mediaElement: true,
      flowchart: FCSilence,
      editor: {
        iconName: "hourglass",
        iconColor: "#fff",
        iconBackgroundColor: "#8A95A5",
      },
      props: [
        {
          name: "duration",
          label: "Duration",
          control: "number",
          required: true,
          default: 0,
        },
      ],
    },
	*/
  ],
};

export default internalActionDefs;
