import { ActionDefs } from "../../../typings";
import {
  FCText,
  FCButton,
  FCInputField,
  FCImage,
  FCAudio,
  FCVideo,
} from "./internalActionFlowchartEls";

const internalActionDefs: ActionDefs = {
  name: "__CHOICELAB__STANDARD__",
  label: "Choicelab Standard",
  actions: [
    {
      name: "text",
      label: "Text",
      description:
        "A block of text that can appear instantly or be associated with a media action.",
      extendable: true,
      timedElement: true,
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
          name: "tag",
          label: "HTML Tag",
          control: "dropdown",
          default: "p",
          options: [
            {
              value: "p",
              label: "Body Text",
            },

            {
              value: "h2",
              label: "Heading 2",
            },
            {
              value: "h3",
              label: "Heading 3",
            },
          ],
        },
      ],
    },
    {
      name: "audio",
      label: "Audio",
      description: "Play an audio file.",
      extendable: false,
      mediaElement: true,
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
      ],
    },
    {
      name: "video",
      label: "Video",
      description: "Play a video file.",
      extendable: false,
      mediaElement: true,
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
      ],
    },
    {
      name: "image",
      label: "Image",
      description:
        "An image file that can appear instantly or be associated with a media action.",
      extendable: true,
      mediaElement: false,
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
    {
      name: "button",
      label: "Button",
      description: "A button that, when pressed, advances to the next node.",
      extendable: true,
      mediaElement: false,
      flowchart: FCButton,
      editor: {
        iconName: "app",
        iconColor: "white",
        iconBackgroundColor: "#FF9502",
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
        /*
        {
          name: "response",
          label: "Response Audio",
          className: "col-2",
          control: "audio",
        },
        {
          name: "responseCaptions",
          label: "Response Captions",
          className: "col-2",
          control: "captions",
        },
		*/
        {
          name: "saveInputs",
          label: "Save Input Fields When Clicked",
          control: "boolean",
          default: true,
        },
      ],
    },
    {
      name: "inputField",
      label: "Input Field",
      description: "A fill-in-the-blank field for entering information.",
      extendable: true,
      mediaElement: false,
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
      ],
    },
  ],
};

export default internalActionDefs;
