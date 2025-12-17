import { Island } from '@hubspot/cms-components';
import ExampleIsland from '../../islands/ExampleIsland.tsx?island';
import { ModuleFields, RichTextField, ColorField, FieldGroup } from '@hubspot/cms-components/fields';

export const hublDataTemplate = `
{% set hublData = {
  "themePrimaryColor": theme.global_colors.primary
} %}
`;

export function Component({ fieldValues, hublData }: any) {
  const { richText, styles } = fieldValues;
  const backgroundColor = styles?.background?.color;
  const { themePrimaryColor } = hublData || {};

  return <Island 
    module={ExampleIsland} 
    richText={richText}
    backgroundColor={backgroundColor}
    themePrimaryColor={themePrimaryColor}
  />;
}

const richTextFieldDefaultValue = `
  <p>Example React Module</p>
`;

export const fields = (
  <ModuleFields>
    <RichTextField
      name="richText"
      label="Rich Text"
      default={richTextFieldDefaultValue}
    />
    <FieldGroup name="styles" label="Styles" tab="STYLE">
      <FieldGroup name="background" label="Background">
        <ColorField
          name="color"
          label="Color"
          showOpacity={true}
        />
      </FieldGroup>  
    </FieldGroup>
  </ModuleFields>
);

export const meta = {
  label: 'Example React Module'
};
