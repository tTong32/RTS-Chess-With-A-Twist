// EnergySystem.js - Energy management with increasing regeneration
import { CustomPieces } from './CustomPieces.js';

export class EnergySystem {
  constructor() {
    // Import piece information including energy costs from CustomPieces
    this.customPieces = new CustomPieces();
    
    // Energy regeneration settings
    this.regenerationSettings = {
      startingRate: 0.5, // energy per second
      maxRate: 10, // maximum energy per second
      increaseInterval: 15000, // increase rate every 15 seconds
      increaseAmount: 0.5, // increase by 0.5 energy/sec each time
    };
    
    // Energy limits
    this.energyLimits = {
      startingEnergy: 6,
      maxEnergy: 25,
    };
  }

  // Get energy cost for a piece type from CustomPieces
  getEnergyCost(pieceType) {
    const pieceInfo = this.customPieces.getPieceInfo(pieceType);
    return pieceInfo.energyCost || 5; // Default cost if piece type not found
  }

  // Calculate current regeneration rate based on game time
  getRegenerationRate(gameTime) {
    const intervals = Math.floor(gameTime / this.regenerationSettings.increaseInterval);
    const rateIncrease = intervals * this.regenerationSettings.increaseAmount;
    return Math.min(
      this.regenerationSettings.startingRate + rateIncrease,
      this.regenerationSettings.maxRate
    );
  }

  // Update energy based on time and regeneration
  updateEnergy(currentEnergy, gameTime, lastUpdate) {
    const timeDiff = gameTime - lastUpdate;
    const regenerationRate = this.getRegenerationRate(gameTime);
    const energyGained = regenerationRate * (timeDiff / 1000);
    
    return Math.min(
      currentEnergy + energyGained,
      this.energyLimits.maxEnergy
    );
  }

  // Check if player can afford to move a piece
  canAffordMove(energy, pieceType) {
    return energy >= this.getEnergyCost(pieceType);
  }

  // Get all pieces that can be moved with current energy
  getAffordablePieces(energy) {
    const affordable = [];
    const allPieceTypes = this.customPieces.getAllPieceTypes();
    
    for (const pieceType of allPieceTypes) {
      const cost = this.getEnergyCost(pieceType);
      if (energy >= cost) {
        affordable.push({ type: pieceType, cost });
      }
    }
    return affordable;
  }

  // Get energy efficiency rating (lower cost = higher efficiency)
  getEfficiencyRating(pieceType) {
    const cost = this.getEnergyCost(pieceType);
    return Math.max(0, 100 - (cost * 10)); // Scale from 0-100
  }

  // Get regeneration progress (0-1) for UI
  getRegenerationProgress(gameTime) {
    const intervals = Math.floor(gameTime / this.regenerationSettings.increaseInterval);
    const maxIntervals = (this.regenerationSettings.maxRate - this.regenerationSettings.startingRate) / this.regenerationSettings.increaseAmount;
    return Math.min(intervals / maxIntervals, 1);
  }

  getMaxEnergy() {
    return this.energyLimits.maxEnergy;
  }
}
