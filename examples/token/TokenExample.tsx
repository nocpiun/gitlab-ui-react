import { useState } from "react";
import { GlToken } from "gitlab-ui-react/token";

const initialTokens = ["documentation", "accessibility", "react"];

export default function TokenExample() {
  const [tokens, setTokens] = useState(initialTokens);

  return (
    <div className="flex flex-wrap gap-3">
      {tokens.map((token) => (
        <GlToken
          key={token}
          removeLabel={`Remove ${token}`}
          onRemove={() => setTokens((current) => current.filter((item) => item !== token))}>
          {token}
        </GlToken>
      ))}
    </div>
  );
}
