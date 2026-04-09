function Lights() {
  return (
    <>
      <ambientLight intensity={0.28} color="#4a5b8a" />
      <hemisphereLight
        intensity={0.45}
        color="#8aa3d6"
        groundColor="#0b0f19"
      />
    </>
  );
}

export default Lights;
