import Grid from "components/grid";

export default function Loading() {
  return (
    <>
      <div className="mb-4 h-6" />
      <Grid className="grid-cols-2 sm:grid-cols-3 xl:grid-cols-4">
        {Array(12)
          .fill(0)
          .map((_, index) => {
            return (
              <Grid.Item
                key={index}
                className="animate-pulse bg-brand-medium-grey/30"
              />
            );
          })}
      </Grid>
    </>
  );
}
