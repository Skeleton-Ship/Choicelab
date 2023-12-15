import { ActionDefs } from "../../typings";

const internalActionDefs: ActionDefs = {
  label: "Choicelab Standard",
  actions: [
    {
      name: "text",
      label: "Text Block",
      description:
        "Show a block of text, which can appear instantly or be associated with a media element.",
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
      description: "Show an image file.",
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
