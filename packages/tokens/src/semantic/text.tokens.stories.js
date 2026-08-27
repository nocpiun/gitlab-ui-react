import COMPILED_TOKENS from '../build/json/tokens.json';
import COMPILED_TOKENS_DARK from '../build/json/tokens.dark.json';
import { createDesignTokenStory } from '../common_story_options';

export const Default = createDesignTokenStory({
  tokens: {
    primary: COMPILED_TOKENS.text.primary,
    secondary: COMPILED_TOKENS.text.secondary,
    tertiary: COMPILED_TOKENS.text.tertiary,
    ...COMPILED_TOKENS.text.color,
  },
});

export const Dark = createDesignTokenStory({
  tokens: {
    primary: COMPILED_TOKENS_DARK.text.primary,
    secondary: COMPILED_TOKENS_DARK.text.secondary,
    tertiary: COMPILED_TOKENS_DARK.text.tertiary,
    ...COMPILED_TOKENS_DARK.text.color,
  },
});

// eslint-disable-next-line storybook/csf-component
export default {
  title: 'tokens/semantic/text',
};
