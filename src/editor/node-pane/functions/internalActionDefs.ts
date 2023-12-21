import { ActionDefs } from "../../../typings";

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
          label: "Variable",
          control: "variable",
          required: true,
        },
        {
          name: "value",
          label: "Value to Set",
          control: "variableValue",
          required: true,
        },
        {
          name: "response",
          label: "Response Audio",
          control: "audio",
        },
        {
          name: "saveInputs",
          label: "Save Inputs When Clicked",
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
      editor: {
        iconName: "input-cursor-text",
        iconColor: "#027AFF",
        iconBackgroundColor: "#E9F2FF",
      },
      props: [
        {
          name: "type",
          label: "Field",
          control: "dropdown",
          default: "text",
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
          required: true,
        },
      ],
    },
  ],
};

export default internalActionDefs;
