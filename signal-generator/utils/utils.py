def get_signal_rsi(x):
    if x is None:
        return 0
    if x > 70:
        return 2
    elif x < 30:
        return 1
    else:
        return 0