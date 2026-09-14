import {
  GlDrawer,
  GlDrawerContent,
  GlDrawerHeader,
  GlDrawerTitle,
  GlDrawerTrigger,
} from "gitlab-ui-react/drawer";

export default function DrawerSidebarExample() {
  return (
    <GlDrawer>
      <GlDrawerTrigger>Open sidebar drawer</GlDrawerTrigger>
      <GlDrawerContent variant="sidebar">
        <GlDrawerHeader sticky>
          <GlDrawerTitle>Reference</GlDrawerTitle>
        </GlDrawerHeader>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
      </GlDrawerContent>
    </GlDrawer>
  );
}
