import wave
import struct
import math
import os

sample_rate = 44100.0
duration = 1.0 # seconds
frequency_start = 800.0
frequency_end = 50.0

os.makedirs('assets', exist_ok=True)
wavef = wave.open('assets/intro.wav', 'w')
wavef.setnchannels(1) # mono
wavef.setsampwidth(2) 
wavef.setframerate(sample_rate)

for i in range(int(duration * sample_rate)):
    t = float(i) / sample_rate
    # exponential frequency sweep
    freq = frequency_start * ((frequency_end / frequency_start) ** t)
    # fade out amplitude
    amp = 32767.0 * (1.0 - t)
    value = int(amp * math.sin(2.0 * math.pi * freq * t))
    # clamp value just in case
    value = max(-32768, min(32767, value))
    data = struct.pack('<h', value)
    wavef.writeframesraw(data)
    
wavef.close()
print("Created intro.wav!")
