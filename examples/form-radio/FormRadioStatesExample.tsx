import { GlFormRadio } from "gitlab-ui-react/form-radio";

export default function FormRadioStatesExample() {
  return (
    <div className="flex flex-col gap-3">
      <GlFormRadio defaultChecked name="example-state" value="selected">
        Selected option
      </GlFormRadio>
      <GlFormRadio disabled name="example-state" value="disabled">
        Unavailable option
      </GlFormRadio>
      <GlFormRadio help="This choice can be changed later." name="separate-example">
        Option with help text
      </GlFormRadio>
    </div>
  );
}
