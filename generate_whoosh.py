import wave
import struct
import math
import random

sample_rate = 44100.0
duration = 1.2

wavef = wave.open('assets/intro.wav', 'w')
wavef.setnchannels(1)
wavef.setsampwidth(2)
wavef.setframerate(sample_rate)

def lowpass(input_sample, prev_output, cutoff_freq, dt):
    RC = 1.0 / (2.0 * math.pi * cutoff_freq)
    alpha = dt / (RC + dt)
    return prev_output + alpha * (input_sample - prev_output)

prev = 0.0
for i in range(int(duration * sample_rate)):
    t = float(i) / sample_rate
    
    # Gaussian amplitude envelope (peaks at 0.5s)
    mu = 0.5
    sigma = 0.2
    amp_env = math.exp(-((t - mu)**2) / (2 * sigma**2))
    
    # White noise
    noise = random.uniform(-1.0, 1.0)
    
    # Cutoff frequency sweeps up then down
    cutoff = 200 + 4000 * amp_env
    
    # Apply filter
    filtered = lowpass(noise, prev, cutoff, 1.0/sample_rate)
    prev = filtered
    
    # Scale to 16-bit PCM
    value = int(32767.0 * filtered * amp_env * 1.5) # Slight boost
    value = max(-32768, min(32767, value))
    
    wavef.writeframesraw(struct.pack('<h', value))

wavef.close()
print("Generated cinematic whoosh!")
