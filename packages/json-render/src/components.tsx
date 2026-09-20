"use client";

import type { ValidationCheck, ValidationConfig } from "@json-render/core";
import type { GitLabComponentName, GitLabProps } from "./catalog.js";
import {
  useEffect,
  useId,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  useBoundProp,
  useFieldValidation,
  type BaseComponentProps,
} from "@json-render/react";
import { GlAccordion, GlAccordionItem } from "gitlab-ui-react/accordion";
import { GlAlert, GlAlertActions, GlAlertDescription } from "gitlab-ui-react/alert";
import { GlAttributeList, GlAttributeListItem } from "gitlab-ui-react/attribute-list";
import { GlAvatar } from "gitlab-ui-react/avatar";
import { GlBadge } from "gitlab-ui-react/badge";
import { GlButton } from "gitlab-ui-react/button";
import { GlButtonGroup } from "gitlab-ui-react/button-group";
import {
  GlCard,
  GlCardContent,
  GlCardFooter,
  GlCardHeader,
} from "gitlab-ui-react/card";
import { GlFormCheckbox } from "gitlab-ui-react/form-checkbox";
import { GlFormDate } from "gitlab-ui-react/form-date";
import {
  GlFormField,
  GlFormFieldDescription,
  GlFormFieldError,
  GlFormFieldLabel,
  GlFormFieldLegend,
  GlFormFieldSet,
} from "gitlab-ui-react/form-field";
import { GlFormInput } from "gitlab-ui-react/form-input";
import { GlFormRadioGroup } from "gitlab-ui-react/form-radio-group";
import { GlFormSelect, GlFormSelectItem } from "gitlab-ui-react/form-select";
import { GlFormTextarea } from "gitlab-ui-react/form-textarea";
import { GlLink } from "gitlab-ui-react/link";
import { GlLoadingIcon } from "gitlab-ui-react/loading-icon";
import { GlMarkdown } from "gitlab-ui-react/markdown";
import { GlPagination } from "gitlab-ui-react/pagination";
import { GlProgressBar } from "gitlab-ui-react/progress-bar";
import { GlSkeletonLoader } from "gitlab-ui-react/skeleton-loader";
import {
  GlTable,
  GlTableBody,
  GlTableCaption,
  GlTableCell,
  GlTableHead,
  GlTableHeader,
  GlTableRow,
} from "gitlab-ui-react/table";
import { GlTab, GlTabs } from "gitlab-ui-react/tabs";
import { GlToggle } from "gitlab-ui-react/toggle";

type RendererProps<K extends GitLabComponentName> = BaseComponentProps<GitLabProps<K>>;
type GitLabComponentRegistry = {
  [K in GitLabComponentName]: (context: RendererProps<K>) => ReactNode;
};

type ValidateOn = "change" | "blur" | "submit";
type ValidationProps = {
  checks?: Array<{ type: string; message: string; args?: Record<string, unknown> }>;
  validateOn?: ValidateOn;
};

function useInteractiveValue<T>(
  propValue: T | undefined,
  bindingPath: string | undefined,
  fallback: T,
) {
  const [boundValue, setBoundValue] = useBoundProp<T>(propValue, bindingPath);
  const [localValue, setLocalValue] = useState<T>(propValue ?? fallback);

  useEffect(() => {
    if(bindingPath === undefined) setLocalValue(propValue ?? fallback);
  }, [bindingPath, fallback, propValue]);

  const value = bindingPath === undefined ? localValue : (boundValue ?? fallback);
  const setValue = (nextValue: T) => {
    if(bindingPath === undefined) setLocalValue(nextValue);
    else setBoundValue(nextValue);
  };

  return [value, setValue] as const;
}

function useRegistryValidation(
  bindingPath: string | undefined,
  { checks, validateOn }: ValidationProps,
  defaultValidateOn: ValidateOn,
) {
  const active = bindingPath !== undefined && Boolean(checks?.length);
  const resolvedValidateOn = validateOn ?? defaultValidateOn;
  const config = useMemo<ValidationConfig | undefined>(() => active ? {
    checks: checks as ValidationCheck[],
    validateOn: resolvedValidateOn,
  } : undefined, [active, checks, resolvedValidateOn]);
  const validation = useFieldValidation(bindingPath ?? "", config);
  const state = active && validation.state.validated ? validation.isValid : null;

  return {
    ...validation,
    active,
    state,
    validateOn: resolvedValidateOn,
    error: active && validation.state.validated ? validation.errors[0] : undefined,
  };
}

function useFieldIds(description?: string, error?: string) {
  const generatedId = useId().replace(/[^a-zA-Z0-9_-]/gu, "");
  const inputId = `json-render-field-${generatedId}`;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return {
    describedBy: [descriptionId, errorId].filter(Boolean).join(" ") || undefined,
    descriptionId,
    errorId,
    inputId,
  };
}

function FieldMessages({
  description,
  descriptionId,
  error,
  errorId,
}: {
  description?: string;
  descriptionId?: string;
  error?: string;
  errorId?: string;
}) {
  return (
    <>
      {description ? (
        <GlFormFieldDescription id={descriptionId}>{description}</GlFormFieldDescription>
      ) : null}
      {error ? <GlFormFieldError id={errorId}>{error}</GlFormFieldError> : null}
    </>
  );
}

function validateFor(validation: ReturnType<typeof useRegistryValidation>, event: ValidateOn) {
  if(!validation.active || validation.validateOn !== event) return;
  if(event !== "change") validation.touch();
  validation.validate();
}

function RenderGlCard({ children, slots }: RendererProps<"GlCard">) {
  return (
    <GlCard>
      {slots?.header ? <GlCardHeader>{slots.header}</GlCardHeader> : null}
      <GlCardContent>{children}</GlCardContent>
      {slots?.footer ? <GlCardFooter>{slots.footer}</GlCardFooter> : null}
    </GlCard>
  );
}

function RenderGlButtonGroup({ children, props }: RendererProps<"GlButtonGroup">) {
  return <GlButtonGroup vertical={props.vertical}>{children}</GlButtonGroup>;
}

function RenderGlAccordion({ props }: RendererProps<"GlAccordion">) {
  return (
    <GlAccordion
      autoCollapse={props.autoCollapse}
      headerLevel={(props.headerLevel ?? 3) as 1 | 2 | 3 | 4 | 5 | 6}>
      {props.items.map((item, index) => (
        <GlAccordionItem
          key={`${index}-${item.title}`}
          defaultVisible={item.defaultVisible}
          title={item.title}>
          <GlMarkdown>{item.content}</GlMarkdown>
        </GlAccordionItem>
      ))}
    </GlAccordion>
  );
}

function RenderGlTabs({ bindings, emit, props }: RendererProps<"GlTabs">) {
  const [value, setValue] = useInteractiveValue(props.value, bindings?.value, 0);

  return (
    <GlTabs
      justified={props.justified}
      lazy={props.lazy}
      onValueChange={(nextValue) => {
        setValue(nextValue);
        emit("change");
      }}
      value={value}>
      {props.items.map((item, index) => (
        <GlTab
          key={`${index}-${item.title}`}
          disabled={item.disabled}
          tabCount={item.count}
          tabCountSrText={item.countSrText}
          title={item.title}>
          <GlMarkdown>{item.content}</GlMarkdown>
        </GlTab>
      ))}
    </GlTabs>
  );
}

function RenderGlPagination({ bindings, emit, props }: RendererProps<"GlPagination">) {
  const [value, setValue] = useInteractiveValue(props.value, bindings?.value, 1);

  return (
    <GlPagination
      align={props.align}
      onNext={() => emit("next")}
      onPrevious={() => emit("previous")}
      onValueChange={(nextValue) => {
        setValue(nextValue);
        emit("change");
      }}
      perPage={props.perPage}
      totalItems={props.totalItems}
      value={value} />
  );
}

function RenderGlAlert({ children, emit, props, slots }: RendererProps<"GlAlert">) {
  const body = children ?? props.message;

  return (
    <GlAlert
      dismissible={props.dismissible}
      headerLevel={props.headerLevel as 1 | 2 | 3 | 4 | 5 | 6 | undefined}
      onDismiss={() => emit("dismiss")}
      sticky={props.sticky}
      title={props.title}
      variant={props.variant}>
      {body ? <GlAlertDescription>{body}</GlAlertDescription> : null}
      {slots?.actions ? <GlAlertActions>{slots.actions}</GlAlertActions> : null}
    </GlAlert>
  );
}

function RenderGlAttributeList({ props }: RendererProps<"GlAttributeList">) {
  return (
    <GlAttributeList layout={props.layout}>
      {props.items.map((item, index) => (
        <GlAttributeListItem key={`${index}-${item.label}`} icon={item.icon} label={item.label}>
          {item.value}
        </GlAttributeListItem>
      ))}
    </GlAttributeList>
  );
}

function RenderGlAvatar({ props }: RendererProps<"GlAvatar">) {
  return <GlAvatar {...props} alt={props.alt ?? props.entityName} />;
}

function RenderGlBadge({ props }: RendererProps<"GlBadge">) {
  return (
    <GlBadge icon={props.icon} iconSize={props.iconSize} variant={props.variant}>
      {props.text}
    </GlBadge>
  );
}

function RenderGlLoadingIcon({ props }: RendererProps<"GlLoadingIcon">) {
  return <GlLoadingIcon {...props} />;
}

function RenderGlMarkdown({ props }: RendererProps<"GlMarkdown">) {
  return <GlMarkdown compact={props.compact}>{props.text}</GlMarkdown>;
}

function RenderGlProgressBar({ props }: RendererProps<"GlProgressBar">) {
  return (
    <GlProgressBar
      aria-label={props.label}
      max={props.max}
      value={props.value}
      variant={props.variant} />
  );
}

function RenderGlSkeletonLoader({ props }: RendererProps<"GlSkeletonLoader">) {
  return <GlSkeletonLoader {...props} />;
}

function RenderGlTable({ props }: RendererProps<"GlTable">) {
  return (
    <GlTable
      bordered={props.bordered}
      borderless={props.borderless}
      hover={props.hover}
      small={props.small}
      stacked={props.stacked}
      striped={props.striped}>
      {props.caption ? <GlTableCaption>{props.caption}</GlTableCaption> : null}
      <GlTableHeader>
        <GlTableRow>
          {props.columns.map((column, index) => (
            <GlTableHead key={`${index}-${column}`} scope="col">{column}</GlTableHead>
          ))}
        </GlTableRow>
      </GlTableHeader>
      <GlTableBody>
        {props.rows.map((row, rowIndex) => (
          <GlTableRow key={rowIndex}>
            {props.columns.map((column, columnIndex) => (
              <GlTableCell key={columnIndex} stackedHeading={column}>
                {row[columnIndex] ?? ""}
              </GlTableCell>
            ))}
          </GlTableRow>
        ))}
      </GlTableBody>
    </GlTable>
  );
}

function RenderGlButton({ emit, loading, props }: RendererProps<"GlButton">) {
  return (
    <GlButton
      block={props.block}
      category={props.category}
      disabled={props.disabled}
      icon={props.icon}
      loading={Boolean(loading || props.loading)}
      onClick={() => emit("press")}
      size={props.size}
      variant={props.variant}>
      {props.label}
    </GlButton>
  );
}

function RenderGlLink({ on, props }: RendererProps<"GlLink">) {
  const press = on("press");

  return (
    <GlLink
      disabled={props.disabled}
      href={props.href}
      onClick={(event) => {
        if(press.shouldPreventDefault) event.preventDefault();
        press.emit();
      }}
      showExternalIcon={props.showExternalIcon}
      target={props.target}
      variant={props.variant}>
      {props.label}
    </GlLink>
  );
}

function RenderGlFormInput({ bindings, emit, props }: RendererProps<"GlFormInput">) {
  const [value, setValue] = useInteractiveValue(props.value, bindings?.value, "");
  const validation = useRegistryValidation(bindings?.value, props, "blur");
  const ids = useFieldIds(props.description, validation.error);

  const handleSubmit = (event: KeyboardEvent<HTMLInputElement>) => {
    if(event.key !== "Enter") return;
    validateFor(validation, "submit");
    emit("submit");
  };

  return (
    <GlFormField>
      <GlFormFieldLabel htmlFor={ids.inputId}>{props.label}</GlFormFieldLabel>
      <GlFormInput
        aria-describedby={ids.describedBy}
        disabled={props.disabled}
        id={ids.inputId}
        max={props.max}
        min={props.min}
        name={props.name}
        number={props.number}
        onBlur={() => {
          validateFor(validation, "blur");
          emit("blur");
        }}
        onFocus={() => emit("focus")}
        onKeyDown={handleSubmit}
        onValueChange={(nextValue) => {
          setValue(nextValue);
          validateFor(validation, "change");
          emit("change");
        }}
        placeholder={props.placeholder}
        readOnly={props.readOnly}
        required={props.required}
        state={validation.state}
        type={props.type}
        value={value}
        width={props.width} />
      <FieldMessages {...ids} description={props.description} error={validation.error} />
    </GlFormField>
  );
}

function RenderGlFormTextarea({ bindings, emit, props }: RendererProps<"GlFormTextarea">) {
  const [value, setValue] = useInteractiveValue(props.value, bindings?.value, "");
  const validation = useRegistryValidation(bindings?.value, props, "blur");
  const ids = useFieldIds(props.description, validation.error);

  return (
    <GlFormField>
      <GlFormFieldLabel htmlFor={ids.inputId}>{props.label}</GlFormFieldLabel>
      <GlFormTextarea
        aria-describedby={ids.describedBy}
        characterCountLimit={props.characterCountLimit}
        disabled={props.disabled}
        id={ids.inputId}
        name={props.name}
        onBlur={() => {
          validateFor(validation, "blur");
          emit("blur");
        }}
        onFocus={() => emit("focus")}
        onSubmit={() => {
          validateFor(validation, "submit");
          emit("submit");
        }}
        onValueChange={(nextValue) => {
          setValue(nextValue);
          validateFor(validation, "change");
          emit("change");
        }}
        placeholder={props.placeholder}
        readOnly={props.readOnly}
        required={props.required}
        rows={props.rows}
        state={validation.state}
        submitOnEnter={props.submitOnEnter}
        value={value} />
      <FieldMessages {...ids} description={props.description} error={validation.error} />
    </GlFormField>
  );
}

function RenderGlFormDate({ bindings, emit, props }: RendererProps<"GlFormDate">) {
  const [value, setValue] = useInteractiveValue(props.value, bindings?.value, "");
  const validation = useRegistryValidation(bindings?.value, props, "blur");
  const ids = useFieldIds(props.description, validation.error);

  return (
    <GlFormField>
      <GlFormFieldLabel htmlFor={ids.inputId}>{props.label}</GlFormFieldLabel>
      <GlFormDate
        aria-describedby={ids.describedBy}
        disabled={props.disabled}
        id={ids.inputId}
        max={props.max}
        maxInvalidFeedback={props.maxInvalidFeedback}
        min={props.min}
        minInvalidFeedback={props.minInvalidFeedback}
        name={props.name}
        onBlur={() => {
          validateFor(validation, "blur");
          emit("blur");
        }}
        onFocus={() => emit("focus")}
        onValueChange={(nextValue) => {
          setValue(nextValue);
          validateFor(validation, "change");
          emit("change");
        }}
        required={props.required}
        state={validation.state}
        value={value} />
      <FieldMessages {...ids} description={props.description} error={validation.error} />
    </GlFormField>
  );
}

function RenderGlFormSelect({ bindings, emit, props }: RendererProps<"GlFormSelect">) {
  const [value, setValue] = useInteractiveValue(props.value, bindings?.value, "");
  const validation = useRegistryValidation(bindings?.value, props, "change");
  const ids = useFieldIds(props.description, validation.error);

  return (
    <GlFormField>
      <GlFormFieldLabel htmlFor={ids.inputId}>{props.label}</GlFormFieldLabel>
      <GlFormSelect
        aria-describedby={ids.describedBy}
        disabled={props.disabled}
        id={ids.inputId}
        name={props.name}
        onBlur={() => {
          validateFor(validation, "blur");
          emit("blur");
        }}
        onFocus={() => emit("focus")}
        onValueChange={(nextValue) => {
          setValue(String(nextValue));
          validateFor(validation, "change");
          emit("change");
        }}
        required={props.required}
        state={validation.state}
        value={value}
        width={props.width}>
        {props.placeholder ? (
          <GlFormSelectItem disabled value="">{props.placeholder}</GlFormSelectItem>
        ) : null}
        {props.options.map((option) => (
          <GlFormSelectItem key={option.value} disabled={option.disabled} value={option.value}>
            {option.label}
          </GlFormSelectItem>
        ))}
      </GlFormSelect>
      <FieldMessages {...ids} description={props.description} error={validation.error} />
    </GlFormField>
  );
}

function RenderGlFormRadioGroup({ bindings, emit, props }: RendererProps<"GlFormRadioGroup">) {
  const [value, setValue] = useInteractiveValue(props.value, bindings?.value, "");
  const validation = useRegistryValidation(bindings?.value, props, "change");
  const ids = useFieldIds(props.description, validation.error);

  return (
    <GlFormFieldSet disabled={props.disabled}>
      <GlFormFieldLegend id={`${ids.inputId}-legend`}>{props.label}</GlFormFieldLegend>
      <GlFormRadioGroup
        aria-describedby={ids.describedBy}
        disabled={props.disabled}
        id={ids.inputId}
        name={props.name}
        onBlur={() => {
          validateFor(validation, "blur");
          emit("blur");
        }}
        onFocus={() => emit("focus")}
        onValueChange={(nextValue) => {
          setValue(String(nextValue));
          validateFor(validation, "change");
          emit("change");
        }}
        options={props.options.map((option) => ({
          disabled: option.disabled,
          text: option.label,
          value: option.value,
        }))}
        required={props.required}
        state={validation.state}
        value={value} />
      <FieldMessages {...ids} description={props.description} error={validation.error} />
    </GlFormFieldSet>
  );
}

function RenderGlFormCheckbox({ bindings, emit, props }: RendererProps<"GlFormCheckbox">) {
  const [checked, setChecked] = useInteractiveValue(props.checked, bindings?.checked, false);
  const validation = useRegistryValidation(bindings?.checked, props, "change");
  const ids = useFieldIds(props.description, validation.error);

  return (
    <GlFormField>
      <GlFormCheckbox
        aria-describedby={ids.describedBy}
        checked={checked}
        disabled={props.disabled}
        id={ids.inputId}
        indeterminate={props.indeterminate}
        name={props.name}
        onBlur={() => {
          validateFor(validation, "blur");
          emit("blur");
        }}
        onCheckedChange={(nextChecked) => {
          setChecked(nextChecked);
          validateFor(validation, "change");
          emit("change");
        }}
        onFocus={() => emit("focus")}
        required={props.required}
        state={validation.state}>
        {props.label}
      </GlFormCheckbox>
      <FieldMessages {...ids} description={props.description} error={validation.error} />
    </GlFormField>
  );
}

function RenderGlToggle({ bindings, emit, loading, props }: RendererProps<"GlToggle">) {
  const [value, setValue] = useInteractiveValue(props.value, bindings?.value, false);
  const validation = useRegistryValidation(bindings?.value, props, "change");
  const ids = useFieldIds(props.description, validation.error);

  return (
    <GlFormField>
      <GlToggle
        aria-required={props.required || undefined}
        aria-describedby={ids.describedBy}
        disabled={props.disabled}
        help={props.help}
        label={props.label}
        labelPosition={props.labelPosition}
        loading={Boolean(loading || props.loading)}
        name={props.name}
        onBlur={() => {
          validateFor(validation, "blur");
          emit("blur");
        }}
        onFocus={() => emit("focus")}
        onValueChange={(nextValue) => {
          setValue(nextValue);
          validateFor(validation, "change");
          emit("change");
        }}
        value={value} />
      <FieldMessages {...ids} description={props.description} error={validation.error} />
    </GlFormField>
  );
}

export const gitlabComponents = {
  GlAccordion: RenderGlAccordion,
  GlAlert: RenderGlAlert,
  GlAttributeList: RenderGlAttributeList,
  GlAvatar: RenderGlAvatar,
  GlBadge: RenderGlBadge,
  GlButton: RenderGlButton,
  GlButtonGroup: RenderGlButtonGroup,
  GlCard: RenderGlCard,
  GlFormCheckbox: RenderGlFormCheckbox,
  GlFormDate: RenderGlFormDate,
  GlFormInput: RenderGlFormInput,
  GlFormRadioGroup: RenderGlFormRadioGroup,
  GlFormSelect: RenderGlFormSelect,
  GlFormTextarea: RenderGlFormTextarea,
  GlLink: RenderGlLink,
  GlLoadingIcon: RenderGlLoadingIcon,
  GlMarkdown: RenderGlMarkdown,
  GlPagination: RenderGlPagination,
  GlProgressBar: RenderGlProgressBar,
  GlSkeletonLoader: RenderGlSkeletonLoader,
  GlTable: RenderGlTable,
  GlTabs: RenderGlTabs,
  GlToggle: RenderGlToggle,
} satisfies GitLabComponentRegistry;
