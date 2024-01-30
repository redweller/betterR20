{
    const token = d20.engine.selected()[0]?.model;
    const newState = !token?.attributes.emits_bright_light;
    const markers = token?.attributes.statusmarkers
        .split(",").filter(m => m !== "half-haze")
        .concat(newState ? "half-haze" : [])
        .join(",");
    token?.save({
        emits_bright_light: newState,
        emits_low_light: newState,
        statusmarkers: markers,
    });
}