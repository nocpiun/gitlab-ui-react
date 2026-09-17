import { GlButton } from "gitlab-ui-react/button";
import { GlFormInput } from "gitlab-ui-react/form-input";
import {
  GlFormInputGroup,
  GlFormInputGroupAddon,
  GlInputGroupText,
} from "gitlab-ui-react/form-input-group";

export default function FormInputGroupStatesExample() {
  return (
    <div className="grid max-w-md gap-4">
      <div>
        <label
          className="mb-2 block font-bold"
          htmlFor="grouped-readonly-path"
          id="grouped-readonly-path-label">
          Repository path (read-only)
        </label>
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
      </div>
      <div>
        <label
          className="mb-2 block font-bold"
          htmlFor="grouped-timeout"
          id="grouped-timeout-label">
          Timeout
        </label>
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
        <p className="mb-0 mt-2" id="grouped-timeout-error">
          Enter a timeout of at least 1 second.
        </p>
      </div>
      <div>
        <label
          className="mb-2 block font-bold"
          htmlFor="grouped-disabled-search"
          id="grouped-disabled-search-label">
          Search projects (disabled)
        </label>
        <GlFormInputGroup aria-labelledby="grouped-disabled-search-label">
          <GlFormInput disabled id="grouped-disabled-search" type="search" />
          <GlFormInputGroupAddon position="append">
            <GlButton disabled>Search</GlButton>
          </GlFormInputGroupAddon>
        </GlFormInputGroup>
      </div>
    </div>
  );
}
