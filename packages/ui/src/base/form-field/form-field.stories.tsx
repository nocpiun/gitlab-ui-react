import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import GlFormCheckbox from "../form-checkbox/form-checkbox";
import GlFormInput from "../form-input/form-input";
import GlFormRadioGroup from "../form-radio-group/form-radio-group";
import GlFormSelect, { GlFormSelectItem } from "../form-select/form-select";
import GlFormField, {
  GlFormFieldDescription,
  GlFormFieldError,
  GlFormFieldGroup,
  GlFormFieldLabel,
  GlFormFieldLegend,
  GlFormFieldSet,
} from "./form-field";

const storyLayout = { maxWidth: "32rem" };

const meta = {
  title: "UI/Base/Form Field",
  component: GlFormField,
  argTypes: {
    children: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Composition-first React replacement for Pajamas Form Group and Form Fields. It supplies structure and styling only; consumers own IDs, ARIA relationships, field state, and form-engine integration.",
      },
    },
  },
} satisfies Meta<typeof GlFormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MultipleFields: Story = {
  render: () => (
    <GlFormFieldGroup style={storyLayout}>
      <GlFormField aria-labelledby="profile-name-label">
        <GlFormFieldLabel htmlFor="profile-name" id="profile-name-label">
          Full name
        </GlFormFieldLabel>
        <GlFormInput id="profile-name" name="name" />
      </GlFormField>

      <GlFormField aria-labelledby="profile-username-label">
        <GlFormFieldLabel htmlFor="profile-username" id="profile-username-label">
          Username <span className="optional-label">(optional)</span>
          <span className="label-description">Used in your profile URL.</span>
        </GlFormFieldLabel>
        <GlFormInput
          aria-describedby="profile-username-description"
          id="profile-username"
          name="username" />
        <GlFormFieldDescription id="profile-username-description">
          You can change this later.
        </GlFormFieldDescription>
      </GlFormField>

      <GlFormField aria-labelledby="profile-role-label">
        <GlFormFieldLabel htmlFor="profile-role" id="profile-role-label">
          Role
        </GlFormFieldLabel>
        <GlFormSelect id="profile-role" name="role" defaultValue="developer">
          <GlFormSelectItem value="developer">Developer</GlFormSelectItem>
          <GlFormSelectItem value="maintainer">Maintainer</GlFormSelectItem>
        </GlFormSelect>
      </GlFormField>
    </GlFormFieldGroup>
  ),
  play: async ({ canvas, canvasElement }) => {
    const fieldGroup = canvasElement.querySelector(".gl-form-field-group");
    const firstField = canvasElement.querySelector(".gl-form-field");

    if(!(fieldGroup instanceof HTMLElement) || !(firstField instanceof HTMLElement)) {
      throw new Error("The field group and its fields must render HTML elements");
    }

    await expect(getComputedStyle(fieldGroup).display).toBe("flex");
    await expect(getComputedStyle(fieldGroup).flexDirection).toBe("column");
    await expect(getComputedStyle(fieldGroup).gap).toBe("16px");
    await expect(getComputedStyle(firstField).marginBottom).toBe("0px");
    await expect(canvas.getAllByRole("group")).toHaveLength(3);
    await expect(canvas.getByRole("textbox", { name: "Full name" })).toBeInTheDocument();
    await expect(canvas.getByRole("textbox", { name: /Username/ })).toHaveAccessibleDescription(
      "You can change this later.",
    );
    await expect(canvas.getByRole("combobox", { name: "Role" })).toHaveValue("developer");
  },
};

export const FieldSetWithFields: Story = {
  render: () => (
    <GlFormFieldSet aria-describedby="address-description" style={storyLayout}>
      <GlFormFieldLegend>Address information</GlFormFieldLegend>
      <GlFormFieldDescription id="address-description">
        Used for billing and account recovery.
      </GlFormFieldDescription>
      <GlFormFieldGroup>
        <GlFormField aria-labelledby="street-label">
          <GlFormFieldLabel htmlFor="street" id="street-label">Street</GlFormFieldLabel>
          <GlFormInput id="street" name="street" />
        </GlFormField>
        <GlFormField aria-labelledby="city-label">
          <GlFormFieldLabel htmlFor="city" id="city-label">City</GlFormFieldLabel>
          <GlFormInput id="city" name="city" />
        </GlFormField>
        <GlFormField aria-labelledby="postal-code-label">
          <GlFormFieldLabel htmlFor="postal-code" id="postal-code-label">
            Postal code
          </GlFormFieldLabel>
          <GlFormInput id="postal-code" name="postalCode" />
        </GlFormField>
      </GlFormFieldGroup>
    </GlFormFieldSet>
  ),
  play: async ({ canvas }) => {
    const fieldSet = canvas.getByRole("group", { name: "Address information" });

    await expect(fieldSet.tagName).toBe("FIELDSET");
    await expect(fieldSet).toHaveAccessibleDescription(
      "Used for billing and account recovery.",
    );
    await expect(fieldSet.querySelectorAll(".gl-form-field")).toHaveLength(3);
  },
};

export const MultipleFieldSets: Story = {
  render: () => (
    <GlFormFieldGroup style={storyLayout}>
      <GlFormFieldSet>
        <GlFormFieldLegend>Account</GlFormFieldLegend>
        <GlFormFieldGroup>
          <GlFormField aria-labelledby="account-email-label">
            <GlFormFieldLabel htmlFor="account-email" id="account-email-label">
              Email
            </GlFormFieldLabel>
            <GlFormInput id="account-email" name="email" type="email" />
          </GlFormField>
          <GlFormField aria-labelledby="account-timezone-label">
            <GlFormFieldLabel htmlFor="account-timezone" id="account-timezone-label">
              Timezone
            </GlFormFieldLabel>
            <GlFormSelect id="account-timezone" name="timezone" defaultValue="utc">
              <GlFormSelectItem value="utc">UTC</GlFormSelectItem>
              <GlFormSelectItem value="local">Local time</GlFormSelectItem>
            </GlFormSelect>
          </GlFormField>
        </GlFormFieldGroup>
      </GlFormFieldSet>

      <GlFormFieldSet>
        <GlFormFieldLegend>Notifications</GlFormFieldLegend>
        <GlFormFieldGroup>
          <GlFormField aria-label="Email notifications">
            <GlFormCheckbox name="emailNotifications">Email notifications</GlFormCheckbox>
          </GlFormField>
          <GlFormField aria-label="Browser notifications">
            <GlFormCheckbox name="browserNotifications">Browser notifications</GlFormCheckbox>
          </GlFormField>
        </GlFormFieldGroup>
      </GlFormFieldSet>
    </GlFormFieldGroup>
  ),
  play: async ({ canvas }) => {
    const fieldSets = canvas.getAllByRole("group", { name: /Account|Notifications/u });

    await expect(fieldSets).toHaveLength(2);
    await expect(canvas.getAllByRole("checkbox")).toHaveLength(2);
  },
};

export const MixedFieldsAndFieldSets: Story = {
  render: () => (
    <GlFormFieldGroup style={storyLayout}>
      <GlFormField aria-labelledby="project-name-label">
        <GlFormFieldLabel htmlFor="project-name" id="project-name-label">
          Project name
        </GlFormFieldLabel>
        <GlFormInput id="project-name" name="projectName" />
      </GlFormField>

      <GlFormFieldSet>
        <GlFormFieldLegend>Visibility</GlFormFieldLegend>
        <GlFormFieldDescription id="visibility-description">
          Choose who can discover and view the project.
        </GlFormFieldDescription>
        <GlFormRadioGroup
          aria-describedby="visibility-description"
          defaultValue="private"
          name="visibility"
          options={[
            { text: "Private", value: "private" },
            { text: "Internal", value: "internal" },
            { text: "Public", value: "public" },
          ]} />
      </GlFormFieldSet>

      <GlFormField aria-labelledby="project-path-label">
        <GlFormFieldLabel htmlFor="project-path" id="project-path-label">
          Project path
        </GlFormFieldLabel>
        <GlFormInput
          aria-describedby="project-path-error"
          aria-invalid="true"
          id="project-path"
          name="projectPath"
          state={false} />
        <GlFormFieldError id="project-path-error">
          This path is already in use.
        </GlFormFieldError>
      </GlFormField>
    </GlFormFieldGroup>
  ),
  play: async ({ canvas }) => {
    for(const radio of canvas.getAllByRole("radio")) {
      await expect(radio).toHaveAccessibleDescription(
        "Choose who can discover and view the project.",
      );
    }
    await expect(canvas.getByRole("textbox", { name: "Project path" })).toHaveAccessibleDescription(
      "This path is already in use.",
    );
    await expect(canvas.getByText("This path is already in use.")).toBeVisible();
  },
};

export const DisabledFieldSet: Story = {
  render: () => (
    <GlFormFieldSet disabled style={storyLayout}>
      <GlFormFieldLegend>Disabled preferences</GlFormFieldLegend>
      <GlFormFieldGroup>
        <GlFormField aria-labelledby="disabled-name-label">
          <GlFormFieldLabel htmlFor="disabled-name" id="disabled-name-label">
            Display name
          </GlFormFieldLabel>
          <GlFormInput id="disabled-name" name="displayName" defaultValue="Tanuki" />
        </GlFormField>
        <GlFormField aria-label="Product updates">
          <GlFormCheckbox name="updates">Product updates</GlFormCheckbox>
        </GlFormField>
      </GlFormFieldGroup>
    </GlFormFieldSet>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox", { name: "Display name" })).toBeDisabled();
    await expect(canvas.getByRole("checkbox", { name: "Product updates" })).toBeDisabled();
  },
};
