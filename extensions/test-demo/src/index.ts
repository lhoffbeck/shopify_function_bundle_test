import type { InputQuery, FunctionResult, Scalars, CartOperation } from "../generated/api";

type RequireStrict<T> = Required<{
  [K in keyof T]: NonNullable<T[K]>;
}>;

type Merchandise = InputQuery["cart"]["lines"][number]["merchandise"];
type ProductVariant = RequireStrict<
  Extract<Merchandise, { __typename: "ProductVariant" }>
>;

const NO_CHANGES: FunctionResult = {
  operations: [],
};

export default (input: InputQuery): FunctionResult => {
  const operations = input.cart.lines.reduce<Array<CartOperation>>((acc, cartLine) => {
    const merchandise = cartLine.merchandise;
    if (canExpand(merchandise)) {
      const componentIds = metafieldToIds(
        merchandise.expandBundleComponents.value
      );
      const componentQuantities = metafieldToQuantities(
        merchandise.expandBundleComponentQuantities.value
      );

      if (componentIds.length !== componentQuantities.length) {
        throw new Error("Invalid expand bundle composition");
      }

      return [
        ...acc,
        {
          expand: {
            cartLineId: cartLine.id,
            expandedCartItems: componentIds.map((merchandiseId, index) => ({
              merchandiseId,
              quantity: componentQuantities[index], 
            })),
          },
        },
      ];
    }

    return acc;
  }, []);

  return operations.length > 0 ? {
    operations,
  } : NO_CHANGES;
};

function canExpand(merchandise: Merchandise): merchandise is ProductVariant {
  return (
    merchandise.__typename === "ProductVariant" &&
    !!merchandise.expandBundleComponentQuantities &&
    !!merchandise.expandBundleComponents
  );
}

function metafieldToIds(metafieldValue: string): Scalars["ID"][] {
  return JSON.parse(metafieldValue);
}

function metafieldToQuantities(metafieldValue: string): Scalars["Int"][] {
  return JSON.parse(metafieldValue);
}
