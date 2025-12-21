import { createFormHook } from "@tanstack/react-form";
import { CardSelectionField } from "../components/card-selection-field";
import { CheckBoxField } from "../components/check-box-field";
import { ComboboxSingleSelectionField } from "../components/combobox-single-selection-field";
import { RadioGroupField } from "../components/radio-group-field";
import { ResetButton } from "../components/reset-button";
import { SubscribeButton } from "../components/subscribe-button";
import { TextField } from "../components/text-field";
import { TextareaField } from "../components/textarea-field";
import { fieldContext, formContext } from "./use-form-context";

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    TextField,
    CheckBoxField,
    ComboboxSingleSelectionField,
    TextareaField,
    RadioGroupField,
    CardSelectionField,
  },
  formComponents: { SubscribeButton, ResetButton },
  fieldContext,
  formContext,
});
