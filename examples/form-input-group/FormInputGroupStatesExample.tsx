import {
  GlFormField,
  GlFormFieldError,
  GlFormFieldGroup,
  GlFormFieldLabel,
} from "gitlab-ui-react/form-field";
import { GlButton } from "gitlab-ui-react/button";
import { GlFormInput } from "gitlab-ui-react/form-input";
import {
  GlFormInputGroup,
  GlFormInputGroupAddon,
  GlInputGroupText,
} from "gitlab-ui-react/form-input-group";

export default function FormInputGroupStatesExample() {
  return (
    <GlFormFieldGroup className="max-w-md">
      <GlFormField>
        <GlFormFieldLabel
          htmlFor="grouped-readonly-path"
          id="grouped-readonly-path-label">
          Repository path (read-only)
        </GlFormFieldLabel>
        <GlFormInputGroup aria-labelledby="grouped-readonly-path-label">
          <GlFormInputGroupAddon position="prepend">
            <GlInputGroupText id="grouped-readonly-prefix">
              https://
            </GlInputGroupText>
          </GlFormInputGroupAddon>
          <GlFormInput
            aria-describedby="grouped-readonly-prefix"
            defaultValue="gitlab.com/example/repository"
            id="grouped-readonly-path"
            readOnly />
        </GlFormInputGroup>
      </GlFormField>
      <GlFormField>
        <GlFormFieldLabel
          htmlFor="grouped-timeout"
          id="grouped-timeout-label">
          Timeout
        </GlFormFieldLabel>
        <GlFormInputGroup aria-labelledby="grouped-timeout-label">
          <GlFormInput
            aria-describedby="grouped-timeout-unit grouped-timeout-error"
            defaultValue={0}
            id="grouped-timeout"
            min={1}
            state={false}
            type="number" />
          <GlFormInputGroupAddon position="append">
            <GlInputGroupText id="grouped-timeout-unit">
              seconds
            </GlInputGroupText>
          </GlFormInputGroupAddon>
        </GlFormInputGroup>
        <GlFormFieldError id="grouped-timeout-error">
          Enter a timeout of at least 1 second.
        </GlFormFieldError>
      </GlFormField>
      <GlFormField>
        <GlFormFieldLabel
          htmlFor="grouped-disabled-search"
          id="grouped-disabled-search-label">
          Search projects (disabled)
        </GlFormFieldLabel>
        <GlFormInputGroup aria-labelledby="grouped-disabled-search-label">
          <GlFormInput disabled id="grouped-disabled-search" type="search" />
          <GlFormInputGroupAddon position="append">
            <GlButton disabled>Search</GlButton>
          </GlFormInputGroupAddon>
        </GlFormInputGroup>
      </GlFormField>
    </GlFormFieldGroup>
  );
}
