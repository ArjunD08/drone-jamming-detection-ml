# Drone Jamming Detection and Counteraction using Machine Learning

This project focuses on the detection and active counteraction of jamming attacks on drones using machine learning techniques. The system is designed to operate on embedded platforms (STM32, ESP01, NRF24), providing real-time detection and intelligent countermeasures against radio frequency interference.

---

## 💡 Key Features

- **Real-time Jamming Detection:** Utilizing RF signal monitoring and classification to detect interference.
- **Embedded-Friendly ML Model:** Optimized for microcontroller deployment on STM32, ESP01, and NRF24 hardware.
- **Automated Counteraction Mechanisms:** Upon detecting jamming signals, countermeasures are automatically triggered.
- **Modular Design:** Easily adaptable to various drone hardware and RF components.

---

## 📂 Repository Structure

- **`docs/`** — Design documentation, system architecture, and usage guides.
- **`datasets/`** — Raw and processed RF signal datasets for training and testing.
- **`models/`** — Trained machine learning models and associated training notebooks.
- **`firmware/`** — Embedded C/C++ code for STM32, ESP01, and NRF24 modules.
- **`src/`** — Python scripts for data preprocessing, ML model inference, and counteraction logic.
- **`tests/`** — Unit and system tests for the detection and counteraction modules.
- **`scripts/`** — Utilities for model training, evaluation, and deployment.

---

## ⚙️ Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/drone-jamming-detection-ml.git
   cd drone-jamming-detection-ml
