export const calculateBMI = (heightInMeters, weightInPounds) => {
    if (
      !heightInMeters || isNaN(heightInMeters) || heightInMeters <= 0 ||
      !weightInPounds || isNaN(weightInPounds) || weightInPounds <= 0
    ) {
      return null; 
    }
  
    const heightInInches = heightInMeters * 39.3701;
    const bmi = (weightInPounds / (heightInInches ** 2)) * 703;
    return bmi.toFixed(1); 
  };
  