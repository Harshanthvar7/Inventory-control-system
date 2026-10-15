package com.example;

public class NumberReverser {

    public static int reverse(int number) {
        int reverse = 0;

        while (number != 0) {
            int digit = number % 10;
            reverse = reverse * 10 + digit;
            number = number / 10;
        }

        return reverse;
    }

    public static void main(String[] args) {
        int number = 1234;
        System.out.println("Reversed number: " + reverse(number));
    }
}