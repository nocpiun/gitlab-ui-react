import {
  GlDrawer,
  GlDrawerContent,
  GlDrawerHeader,
  GlDrawerTitle,
  GlDrawerTrigger,
} from "gitlab-ui-react/drawer";

export default function DrawerExample() {
  return (
    <GlDrawer>
      <GlDrawerTrigger>Open drawer</GlDrawerTrigger>
      <GlDrawerContent>
        <GlDrawerHeader>
          <GlDrawerTitle>Additional details</GlDrawerTitle>
        </GlDrawerHeader>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
      </GlDrawerContent>
    </GlDrawer>
  );
}
