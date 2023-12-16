import { ActionDefs } from "../../typings";

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
      props: [
        {
          name: "contents",
          control: "textarea",
          default: "",
          required: true,
        },
        {
          name: "tag",
          control: "dropdown",
          default: "p",
          options: [
            {
              value: "p",
              label: "Body text",
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
      props: [
        {
          name: "media",
          control: "audio",
          required: true,
        },
        {
          name: "captions",
          control: "caption",
        },
      ],
    },
    {
      name: "video",
      label: "Video",
      description: "Play a video file.",
      extendable: false,
      mediaElement: true,
      props: [
        {
          name: "media",
          control: "video",
          required: true,
        },
        {
          name: "captions",
          control: "caption",
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
      props: [
        {
          name: "source",
          control: "image",
          required: true,
        },
        {
          name: "alt",
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
      props: [
        {
          name: "label",
          control: "text",
          required: true,
          default: "",
        },
        {
          name: "varToSet",
          control: "variable",
          required: true,
        },
        {
          name: "value",
          control: "variableValue",
          required: true,
        },
        {
          name: "response",
          control: "audio",
        },
        {
          name: "saveInputs",
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
      props: [
        {
          name: "type",
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
          control: "variable",
          required: true,
        },
      ],
    },
  ],
};

export default internalActionDefs;
