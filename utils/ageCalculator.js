export const calculateAge = (dobString) => {
    const dobDate = new Date(dobString);
    const diff = Date.now() - dobDate.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };
  