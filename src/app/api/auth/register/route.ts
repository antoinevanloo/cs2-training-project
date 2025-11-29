import { NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/db/queries/users';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  username: z
    .string()
    .min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères')
    .max(30, 'Le nom d\'utilisateur ne peut pas dépasser 30 caractères')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores'
    ),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validation
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, username, password } = validationResult.data;

    // Vérifier si l'email existe déjà
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec cet email' },
        { status: 409 }
      );
    }

    // Créer l'utilisateur
    const user = await createUser({
      email,
      username,
      password,
    });

    return NextResponse.json(
      {
        message: 'Compte créé avec succès',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'inscription' },
      { status: 500 }
    );
  }
}
