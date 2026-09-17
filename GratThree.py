import sys

def greatest_of_three(a, b, c):
    return max(a, b, c)

if __name__ == "__main__":
    if len(sys.argv) > 3:
        a, b, c = int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3])
    else:
        a, b, c = 10, 25, 15
    print(f"Greatest of {a}, {b}, {c} is: {greatest_of_three(a, b, c)}")
