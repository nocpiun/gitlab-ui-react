import { useEffect, useState } from "react";
import { GlTab, GlTabs } from "gitlab-ui-react/tabs";
import { packageManagers, type PackageManager } from "../package-managers";

export type PackageManagerTabsProps = {
  dependencies: string;
};

const DEFAULT_PACKAGE_MANAGER: PackageManager = "pnpm";
const PACKAGE_MANAGER_STORAGE_KEY = "gitlab-ui-react-package-manager";
const PACKAGE_MANAGER_CHANGE_EVENT = "gitlab-ui-react:package-manager-change";

function isPackageManager(value: unknown): value is PackageManager {
  return packageManagers.some(({ title }) => title === value);
}

function getStoredPackageManager(): PackageManager {
  if(typeof window === "undefined") return DEFAULT_PACKAGE_MANAGER;

  try {
    const storedPackageManager = window.localStorage.getItem(PACKAGE_MANAGER_STORAGE_KEY);
    return isPackageManager(storedPackageManager)
      ? storedPackageManager
      : DEFAULT_PACKAGE_MANAGER;
  } catch {
    return DEFAULT_PACKAGE_MANAGER;
  }
}

export function PackageManagerTabs({ dependencies }: PackageManagerTabsProps) {
  const [selectedPackageManager, setSelectedPackageManager] = useState<PackageManager>(
    DEFAULT_PACKAGE_MANAGER,
  );
  const selectedIndex = packageManagers.findIndex(
    ({ title }) => title === selectedPackageManager,
  );

  useEffect(() => {
    setSelectedPackageManager(getStoredPackageManager());

    function syncPackageManager(event: Event) {
      if(event instanceof CustomEvent && isPackageManager(event.detail)) {
        setSelectedPackageManager(event.detail);
      }
    }

    function syncPackageManagerFromStorage(event: StorageEvent) {
      if(event.key !== PACKAGE_MANAGER_STORAGE_KEY) return;

      setSelectedPackageManager(
        isPackageManager(event.newValue) ? event.newValue : DEFAULT_PACKAGE_MANAGER,
      );
    }

    window.addEventListener(PACKAGE_MANAGER_CHANGE_EVENT, syncPackageManager);
    window.addEventListener("storage", syncPackageManagerFromStorage);

    return () => {
      window.removeEventListener(PACKAGE_MANAGER_CHANGE_EVENT, syncPackageManager);
      window.removeEventListener("storage", syncPackageManagerFromStorage);
    };
  }, []);

  function selectPackageManager(index: number) {
    const packageManager = packageManagers[index]?.title;
    if(!packageManager) return;

    setSelectedPackageManager(packageManager);

    try {
      window.localStorage.setItem(PACKAGE_MANAGER_STORAGE_KEY, packageManager);
    } catch {
      // Keep the tabs synchronized in this page when storage is unavailable.
    }

    window.dispatchEvent(new CustomEvent<PackageManager>(
      PACKAGE_MANAGER_CHANGE_EVENT,
      { detail: packageManager },
    ));
  }

  return (
    <GlTabs
      className="my-7"
      onValueChange={selectPackageManager}
      value={selectedIndex}>
      {packageManagers.map(({ command, title }) => (
        <GlTab key={title} title={title}>
          <div className="docs-code-block my-1!">
            <pre>
              <code className="language-sh">{`${command} ${dependencies}`}</code>
            </pre>
          </div>
        </GlTab>
      ))}
    </GlTabs>
  );
}
